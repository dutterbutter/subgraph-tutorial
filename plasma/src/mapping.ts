import {
  Visited as VisitedEvent,
  Plasma2Ethereum as Plasma2EthereumEvent,
  Plasma2Handle as Plasma2HandleEvent,
  Joined as JoinedEvent
} from "../generated/Contract/TwoKeyPlasmaEvents"

import { Campaign, User, Visit, Test, Meta, VisitEvent, PlasmaToEthereumMappingEvent, JoinEvent, Join} from "../generated/schema"
import { log,Address, BigInt } from '@graphprotocol/graph-ts'


function createMetadata(eventAddress: Address, timeStamp:BigInt): void {
  let metadata = Meta.load(eventAddress.toHex());
  if (metadata == null){
    metadata = new Meta(eventAddress.toHex());
    metadata._visitCounter = 0;
    metadata._joinsCounter = 0;
    metadata._subgraphType = 'PLASMA';
    metadata._n_campaigns = 0;
    metadata._version = 11;
    metadata._plasmaToHandleCounter = 0;
    metadata._plasmaToEthereumCounter = 0;
    metadata._timeStamp = timeStamp;
    metadata._updatedAt = timeStamp;
    metadata.save();
  }
}


function createCampaignObject(eventAddress:Address, campaignAddress: Address, timeStamp: BigInt): void {
  let campaign = Campaign.load(campaignAddress.toHex());
  if (campaign == null){
    let metadata = Meta.load(eventAddress.toHex());
    metadata._n_campaigns++;
    metadata._updatedAt = timeStamp;
    metadata.save();
    
    campaign = new Campaign(campaignAddress.toHex());
    campaign._timeStamp = timeStamp;
    campaign._n_visits = 0;
    campaign._n_joins = 0;
    campaign._subgraphType = 'PLASMA';
    campaign._updatedTimeStamp = timeStamp;
    campaign._version = 12;
    campaign.save();
  }
}


export function handleHandled(event: Plasma2HandleEvent): void {
  // log.debug('Handle {} Visited))))))))',['string arg']);
  createMetadata(event.address, event.block.timestamp);
  let metadata = Meta.load(event.address.toHex());
  metadata._plasmaToHandleCounter = metadata._plasmaToHandleCounter + 1;
  metadata._updatedAt = event.block.timestamp;
  metadata.save();

  let user = User.load(event.params.plasma.toHex());
  if (user == null){
    user = new User(event.params.plasma.toHex());
    user._timeStamp = event.block.timestamp;
  }

  user._handle = event.params.handle;
  user.save();
}

export function handleJoined(event: JoinedEvent): void {
  createMetadata(event.address, event.block.timestamp);
  let metadata = Meta.load(event.address.toHex());
  metadata._joinsCounter++;
  metadata._updatedAt = event.block.timestamp;
  metadata.save();

  //Add user by new visitor address
  // log.debug('Handle {} Visited))))))))',['string arg']);
  // log.info('info - Handle {} 1))))))))',['string arg']);

  let referrer = User.load(event.params.fromPlasma.toHex());
  if (referrer== null){
    referrer = new User(event.params.fromPlasma.toHex());
    referrer._timeStamp = event.block.timestamp;
    referrer.save();
  }


  // log.info('info - Handle {} 2))))))))',['string arg']);
  let visitor = User.load(event.params.toPlasma.toHex());
  if (visitor == null){
    visitor = new User(event.params.toPlasma.toHex());
    visitor._timeStamp = event.block.timestamp;
    visitor.save();
  }

  createCampaignObject(event.address, event.params.campaignAddress, event.block.timestamp);
  let campaign = Campaign.load(event.params.campaignAddress.toHex());

  campaign._n_joins++;
  campaign._updatedTimeStamp = event.block.timestamp;
  campaign.save();

  let join = Join.load(event.params.fromPlasma.toHex()+'-'+event.params.toPlasma.toHex()+'-'+ event.params.campaignAddress.toHex());
  if (join == null){
    join = new Join(event.params.fromPlasma.toHex()+'-'+event.params.toPlasma.toHex()+'-'+ event.params.campaignAddress.toHex());
    join._visitor = visitor.id;
    join._campaign = campaign.id;
    join._referrer = referrer.id;
    join._timeStamp = event.block.timestamp;
    join.save();
  }

  let joinEvent = JoinEvent.load(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  if(joinEvent == null){
    joinEvent = new JoinEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    joinEvent._campaign = campaign.id;
    joinEvent._referrer = referrer.id;
    joinEvent._visitor = visitor.id;
    joinEvent._timeStamp = event.block.timestamp;
    joinEvent.save();
  }
}


export function handleVisited(event: VisitedEvent): void {
  // event.params.to            - Plamsa address
  // event.params.c             - Campaign contract on Ethereum
  // event.params.contractor    - Contractor Web3 Address
  // event.params.from          - Previous plasma Address

  createMetadata(event.address, event.block.timestamp);
  let metadata = Meta.load(event.address.toHex());
  metadata._visitCounter++;
  metadata._updatedAt = event.block.timestamp;
  metadata.save();

  //Add user by new visitor address
  // log.debug('Handle {} Visited))))))))',['string arg']);
  // log.info('info - Handle {} 1))))))))',['string arg']);

  let referrer = User.load(event.params.from.toHex());
  if (referrer== null){
    referrer = new User(event.params.from.toHex());
    referrer._timeStamp = event.block.timestamp;
    referrer.save();
  }


  // log.info('info - Handle {} 2))))))))',['string arg']);
  let visitor = User.load(event.params.to.toHex());
  if (visitor == null){
    visitor = new User(event.params.to.toHex());
    visitor._timeStamp = event.block.timestamp;
    visitor.save();
  }

  createCampaignObject(event.address, event.params.c, event.block.timestamp);
  let campaign = Campaign.load(event.params.c.toHex());

  campaign._n_visits++;
  campaign._updatedTimeStamp = event.block.timestamp;
  campaign.save();

  let visit = Visit.load(event.params.from.toHex()+'-'+event.params.to.toHex()+'-'+ event.params.c.toHex());
  if (visit == null){
    visit = new Visit(event.params.from.toHex()+'-'+event.params.to.toHex()+'-'+ event.params.c.toHex());
    visit._visitor = visitor.id;
    visit._campaign = campaign.id;
    visit._referrer = referrer.id;
    visit._timeStamp = event.block.timestamp;
    visit.save();
  }

  let visitEvent = VisitEvent.load(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  if(visitEvent == null){
    visitEvent = new VisitEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    visitEvent._campaign = campaign.id;
    visitEvent._referrer = referrer.id;
    visitEvent._visitor = visitor.id;
    visitEvent._timeStamp = event.block.timestamp;
    visitEvent.save();
  }
}

export function handlePlasma2Ethereum(event: Plasma2EthereumEvent): void {
  // event.params.plasma
  // event.params.eth
  // log.debug('Handle {} Plasma2EthereumEvent))))))))',['string arg']);
  // log.info('INFO - Handle {} Plasma2EthereumEvent))))))))',['string arg']);

  createMetadata(event.address, event.block.timestamp);
  let metadata = Meta.load(event.address.toHex());
  metadata._plasmaToEthereumCounter = metadata._plasmaToEthereumCounter + 1;
  metadata._updatedAt = event.block.timestamp;
  metadata.save();

  let user = User.load(event.params.plasma.toHex());
  if(user == null){
    user = new User(event.params.plasma.toHex());
    user._web3Address = event.params.eth;
    user._timeStamp = event.block.timestamp;
    user.save();
  }
  else{
    user._web3Address = event.params.eth;
    user.save();
  }

  let mappingEvent = PlasmaToEthereumMappingEvent.load(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  if(mappingEvent == null){
    mappingEvent = new PlasmaToEthereumMappingEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
    mappingEvent._ethereum = event.params.eth;
    mappingEvent._plasma = user.id;
    mappingEvent._timeStamp = event.block.timestamp;
    mappingEvent.save();
  }
}
